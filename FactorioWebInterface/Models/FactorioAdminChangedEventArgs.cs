using FactorioWebInterface.Data;

namespace FactorioWebInterface.Models
{
    public class FactorioAdminsAddedEventArgs
    {
        public Admin[] Admins { get; }

        public FactorioAdminsAddedEventArgs(Admin[] admins)
        {
            Admins = admins;
        }
    }

    public class FactorioAdminRemovedEventArgs
    {
        public Admin Admin { get; }

        public FactorioAdminRemovedEventArgs(Admin admin)
        {
            Admin = admin;
        }
    }
}
