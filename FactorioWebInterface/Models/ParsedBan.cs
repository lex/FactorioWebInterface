using FactorioWebInterface.Data;
using System;

namespace FactorioWebInterface.Models
{
    public class ParsedBan
    {
        public string Username { get; }
        public string Reason { get; }
        public string Admin { get; }
        public DateTime DateTime { get; } = Ban.dummyDate;

        public ParsedBan(string username, string reason, string admin, DateTime dateTime)
        {
            Username = username;
            Reason = reason;
            Admin = admin;
            DateTime = dateTime;
        }

        public Ban ToBan() => new Ban()
        {
            Username = Username,
            Reason = Reason,
            Admin = Admin,
            DateTime = DateTime
        };
    }
}
