using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Data
{
    public class Admin : IEquatable<Admin>
    {
        [Key]
        public string Name { get; set; }

        public override bool Equals(object obj)
        {
            return Equals(obj as Admin);
        }

        public bool Equals(Admin other)
        {
            return other != null &&
                   Name == other.Name;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Name);
        }

        public static bool operator ==(Admin left, Admin right)
        {
            return EqualityComparer<Admin>.Default.Equals(left, right);
        }

        public static bool operator !=(Admin left, Admin right)
        {
            return !(left == right);
        }
    }
}
