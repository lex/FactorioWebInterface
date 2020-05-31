namespace FactorioWebInterface.Options
{
    public class DefaultAdminAccountOption
    {
        public const string DefaultAdminAccount = "DefaultAdminAccount";

        public string Username { get; set; } = "Admin";
        public bool Enabled { get; set; }
    }
}
