namespace Finance_Tracking;

public static class UserContext
{
    private static readonly AsyncLocal<int?> _userId = new AsyncLocal<int?>();

    public static int? CurrentUserId
    {
        get => _userId.Value;
        set => _userId.Value = value;
    }
}
