namespace Finance_Tracking.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<FinancialAccount> FinancialAccounts { get; set; } = new List<FinancialAccount>();
}