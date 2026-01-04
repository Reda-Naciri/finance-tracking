using Microsoft.EntityFrameworkCore;
using Finance_Tracking.Data;
using Finance_Tracking.Models;

// Fix PostgreSQL DateTime timezone issue
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
// Read from DATABASE_URL (Railway standard) or ConnectionStrings:DefaultConnection
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("No database connection string found! Set DATABASE_URL environment variable or ConnectionStrings:DefaultConnection in appsettings.json");
}

// Convert PostgreSQL URI format to Npgsql connection string format
if (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://"))
{
    var uri = new Uri(connectionString);
    connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={uri.UserInfo.Split(':')[0]};Password={uri.UserInfo.Split(':')[1]};SSL Mode=Require;Trust Server Certificate=true";
    Console.WriteLine("Converted PostgreSQL URI to connection string format");
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
    // Auto-detect database type from connection string
    if (connectionString.Contains("Host=") && connectionString.Contains("Database="))
    {
        // PostgreSQL (Npgsql format)
        Console.WriteLine("Using PostgreSQL database");
        options.UseNpgsql(connectionString);
    }
    else if (connectionString.Contains(".db"))
    {
        // SQLite
        Console.WriteLine("Using SQLite database");
        options.UseSqlite(connectionString);
    }
    else
    {
        // SQL Server (default)
        Console.WriteLine("Using SQL Server database");
        options.UseSqlServer(connectionString);
    }
});

// Configure JSON serialization to handle circular references
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // In production, you should restrict this to your actual frontend domain
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? new[]
        {
            "http://localhost:5173",
            "http://localhost:8080",
            "http://localhost:8081",
            "http://localhost:8082",
            "http://192.168.11.108:8080",
            "http://192.168.11.108:8081",
            "http://192.168.11.108:5173"
        };

        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();
}

// Minimal API Endpoints

// ============ FINANCIAL ACCOUNTS ============

// GET /api/financial-accounts
app.MapGet("/api/financial-accounts", async (AppDbContext db) =>
{
    return await db.FinancialAccounts.OrderBy(a => a.Name).ToListAsync();
});

// POST /api/financial-accounts
app.MapPost("/api/financial-accounts", async (AppDbContext db, FinancialAccount account) =>
{
    account.UserId = 1; // Hardcoded for single user
    db.FinancialAccounts.Add(account);
    await db.SaveChangesAsync();
    return Results.Created($"/api/financial-accounts/{account.Id}", account);
});

// DELETE /api/financial-accounts/{id}
app.MapDelete("/api/financial-accounts/{id}", async (AppDbContext db, int id) =>
{
    var account = await db.FinancialAccounts.FindAsync(id);
    if (account == null) return Results.NotFound();
    
    // Don't allow deletion of default accounts (Cash, Bank, Savings)
    if (account.Id <= 3) return Results.BadRequest("Cannot delete default financial accounts");
    
    db.FinancialAccounts.Remove(account);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ============ CATEGORIES ============

// GET /api/categories
app.MapGet("/api/categories", async (AppDbContext db) =>
{
    return await db.Categories.OrderBy(c => c.Name).ToListAsync();
});

// POST /api/categories
app.MapPost("/api/categories", async (AppDbContext db, Category category) =>
{
    db.Categories.Add(category);
    await db.SaveChangesAsync();
    return Results.Created($"/api/categories/{category.Id}", category);
});

// DELETE /api/categories/{id}
app.MapDelete("/api/categories/{id}", async (AppDbContext db, int id) =>
{
    var category = await db.Categories.FindAsync(id);
    if (category == null) return Results.NotFound();
    
    // Don't allow deletion of "Other" categories (fallback categories)
    if (category.Id == 6 || category.Id == 7) 
        return Results.BadRequest("Cannot delete 'Other' categories");
    
    // Move all transactions from this category to appropriate "Other" category
    var fallbackCategoryId = category.Type == "expense" ? 6 : 7; // Other or Other Income
    
    var transactions = await db.Transactions
        .Where(t => t.CategoryId == id)
        .ToListAsync();
        
    foreach (var transaction in transactions)
    {
        transaction.CategoryId = fallbackCategoryId;
    }
    
    db.Categories.Remove(category);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ============ TRANSACTIONS ============

// GET /api/transactions
app.MapGet("/api/transactions", async (AppDbContext db, int? financialAccountId, string? month) =>
{
    var query = db.Transactions.Include(t => t.Category).AsQueryable();
    
    if (financialAccountId.HasValue)
        query = query.Where(t => t.FinancialAccountId == financialAccountId.Value);
        
    if (!string.IsNullOrEmpty(month))
    {
        var date = DateTime.ParseExact(month, "yyyy-MM", null);
        var startOfMonth = new DateTime(date.Year, date.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1);
        query = query.Where(t => t.Date >= startOfMonth && t.Date < endOfMonth);
    }
    
    return await query.OrderByDescending(t => t.Date).ToListAsync();
});

// POST /api/transactions
app.MapPost("/api/transactions", async (AppDbContext db, Transaction transaction) =>
{
    db.Transactions.Add(transaction);
    await db.SaveChangesAsync();
    return Results.Created($"/api/transactions/{transaction.Id}", transaction);
});

// ============ SUMMARY AND BALANCE ============

// GET /api/summary - Total summary across all financial accounts
app.MapGet("/api/summary", async (AppDbContext db, string month) =>
{
    var date = DateTime.ParseExact(month, "yyyy-MM", null);
    var startOfMonth = new DateTime(date.Year, date.Month, 1);
    var endOfMonth = startOfMonth.AddMonths(1);
    
    var transactions = await db.Transactions
        .Where(t => t.Date >= startOfMonth && t.Date < endOfMonth)
        .ToListAsync();
    
    var totalIncome = transactions.Where(t => t.Type == "income").Sum(t => t.Amount);
    var totalExpenses = transactions.Where(t => t.Type == "expense").Sum(t => t.Amount);
    
    return new
    {
        TotalIncome = totalIncome,
        TotalExpenses = totalExpenses,
        Net = totalIncome - totalExpenses
    };
});

// GET /api/financial-accounts/{id}/balance
app.MapGet("/api/financial-accounts/{id}/balance", async (AppDbContext db, int id) =>
{
    var transactions = await db.Transactions
        .Where(t => t.FinancialAccountId == id)
        .ToListAsync();

    var income = transactions.Where(t => t.Type == "income").Sum(t => t.Amount);
    var expenses = transactions.Where(t => t.Type == "expense").Sum(t => t.Amount);

    return income - expenses;
});

// GET /api/total-balance - Total balance across all financial accounts
app.MapGet("/api/total-balance", async (AppDbContext db) =>
{
    var transactions = await db.Transactions.ToListAsync();

    var income = transactions.Where(t => t.Type == "income").Sum(t => t.Amount);
    var expenses = transactions.Where(t => t.Type == "expense").Sum(t => t.Amount);

    return income - expenses;
});

// GET /api/categories/{month}/spending
app.MapGet("/api/categories/{month}/spending", async (AppDbContext db, string month, int? financialAccountId) =>
{
    var date = DateTime.ParseExact(month, "yyyy-MM", null);
    var startOfMonth = new DateTime(date.Year, date.Month, 1);
    var endOfMonth = startOfMonth.AddMonths(1);

    var query = db.Transactions
        .Include(t => t.Category)
        .Where(t => t.Date >= startOfMonth && t.Date < endOfMonth);

    if (financialAccountId.HasValue)
        query = query.Where(t => t.FinancialAccountId == financialAccountId.Value);

    var transactions = await query.ToListAsync();

    var categorySpending = transactions
        .GroupBy(t => new { t.CategoryId, t.Category.Name, t.Type })
        .Select(g => new
        {
            CategoryId = g.Key.CategoryId,
            CategoryName = g.Key.Name,
            Type = g.Key.Type,
            Amount = g.Sum(t => t.Amount)
        })
        .ToList();

    return categorySpending;
});

app.Run();