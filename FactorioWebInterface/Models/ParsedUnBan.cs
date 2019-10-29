namespace FactorioWebInterface.Models
{
    public class ParsedUnBan
    {
        public string Username { get; }
        public string Admin { get; }

        public ParsedUnBan(string username, string admin)
        {
            Username = username;
            Admin = admin;
        }
    }
}
