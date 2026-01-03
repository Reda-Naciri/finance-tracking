namespace Finance_Tracking.Models;

public class FinancialAccount
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // Account title
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}