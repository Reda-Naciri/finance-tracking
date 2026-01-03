using Microsoft.EntityFrameworkCore;
using Finance_Tracking.Models;

namespace Finance_Tracking.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    public DbSet<User> Users { get; set; }
    public DbSet<FinancialAccount> FinancialAccounts { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Password).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CreatedAt).IsRequired();
            
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // FinancialAccount configuration
        modelBuilder.Entity<FinancialAccount>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedAt).IsRequired();

            entity.HasOne(e => e.User)
                .WithMany(u => u.FinancialAccounts)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(10);
            entity.Property(e => e.CreatedAt).IsRequired();
        });
        
        // Transaction configuration
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Amount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.Type).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Date).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            
            // Foreign key relationships
            entity.HasOne(e => e.FinancialAccount)
                .WithMany(a => a.Transactions)
                .HasForeignKey(e => e.FinancialAccountId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Category)
                .WithMany(c => c.Transactions)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Seed default categories (including "Other" as fallback)
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Salary", Type = "income", CreatedAt = DateTime.UtcNow },
            new Category { Id = 2, Name = "Food", Type = "expense", CreatedAt = DateTime.UtcNow },
            new Category { Id = 3, Name = "Transport", Type = "expense", CreatedAt = DateTime.UtcNow },
            new Category { Id = 4, Name = "Entertainment", Type = "expense", CreatedAt = DateTime.UtcNow },
            new Category { Id = 5, Name = "Utilities", Type = "expense", CreatedAt = DateTime.UtcNow },
            new Category { Id = 6, Name = "Other", Type = "expense", CreatedAt = DateTime.UtcNow },
            new Category { Id = 7, Name = "Other Income", Type = "income", CreatedAt = DateTime.UtcNow }
        );

        // Seed default user and financial accounts
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Email = "reda_naciri@icloud.com", FullName = "Reda Naciri", Password = "123456789", CreatedAt = DateTime.UtcNow }
        );

        modelBuilder.Entity<FinancialAccount>().HasData(
            new FinancialAccount { Id = 1, Name = "Cash", UserId = 1, CreatedAt = DateTime.UtcNow },
            new FinancialAccount { Id = 2, Name = "Bank", UserId = 1, CreatedAt = DateTime.UtcNow },
            new FinancialAccount { Id = 3, Name = "Savings", UserId = 1, CreatedAt = DateTime.UtcNow }
        );
    }
}