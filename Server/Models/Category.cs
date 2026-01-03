namespace Finance_Tracking.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "income" or "expense"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}