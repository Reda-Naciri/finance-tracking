namespace Finance_Tracking.Models;

public class Transaction
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty; // Description/title of transaction
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty; // "income" or "expense"
    public DateTime Date { get; set; }
    public int FinancialAccountId { get; set; }
    public int CategoryId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public FinancialAccount FinancialAccount { get; set; } = null!;
    public Category Category { get; set; } = null!;
}