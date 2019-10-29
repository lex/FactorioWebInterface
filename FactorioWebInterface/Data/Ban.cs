using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FactorioWebInterface.Data
{
    public class Ban : IEquatable<Ban>
    {
        // Decoding the default DateTime causes errors with message pack.
        public static readonly DateTime dummyDate = new DateTime(1970, 1, 1);

        // Not nullable for the database.
        [Key]
        [JsonProperty(PropertyName = "username")]
        public string? Username { get; set; }

        [JsonProperty(PropertyName = "reason")]
        public string? Reason { get; set; }

        public string? Address { get; set; }

        [JsonProperty(PropertyName = "admin")]
        public string? Admin { get; set; }

        [JsonProperty(PropertyName = "dateTime")]
        public DateTime DateTime { get; set; } = dummyDate;

        public override bool Equals(object? obj)
        {
            return Equals(obj as Ban);
        }

        public bool Equals(Ban? other)
        {
            return other != null &&
                   Username == other.Username &&
                   Reason == other.Reason &&
                   Address == other.Address &&
                   Admin == other.Admin &&
                   DateTime == other.DateTime;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Username, Reason, Address, Admin, DateTime);
        }

        public static bool operator ==(Ban? left, Ban? right)
        {
            return EqualityComparer<Ban>.Default.Equals(left, right);
        }

        public static bool operator !=(Ban? left, Ban? right)
        {
            return !(left == right);
        }
    }
}
