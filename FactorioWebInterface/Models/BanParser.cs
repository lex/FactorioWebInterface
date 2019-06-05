using FactorioWebInterface.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FactorioWebInterface.Models
{
    public static class BanParser
    {
        public static Ban FromBanGameOutput(string content)
        {
            int index = content.IndexOf(" was banned by ");

            if (index < 0)
            {
                return null;
            }

            string player = content.Substring(0, index).Trim();
            if (player.EndsWith(" (not on map)"))
            {
                player = player.Substring(0, player.Length - 13);
            }

            index += 15;

            if (index >= content.Length)
            {
                return null;
            }

            string rest = content.Substring(index);

            string[] words = rest.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (words.Length < 2)
            {
                return null;
            }

            string admin = words[0];

            int reasonIndex = 1;

            // If the admin has a tag, that will appear after their name.
            if (words[reasonIndex] == "Reason:")
            {
                // case no tag, remove '.' at end of name.
                admin = admin.Substring(0, admin.Length - 1);
            }
            else
            {
                // case tag, keep going utill we find 'Reason:'
                do
                {
                    reasonIndex++;
                    if (reasonIndex >= words.Length)
                    {
                        return null;
                    }
                } while (words[reasonIndex] != "Reason:");
            }

            reasonIndex += 1;
            string reason = string.Join(' ', words, reasonIndex, words.Length - reasonIndex);

            if (reason.EndsWith(".."))
            {
                reason = reason.Substring(0, reason.Length - 1);
            }

            return new Ban()
            {
                Username = player,
                Admin = admin,
                Reason = reason,
                DateTime = DateTime.UtcNow
            };
        }

        public static Ban FromBanCommand(string content, string actor)
        {
            string[] words = content.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            if (words.Length < 2)
            {
                return null;
            }

            string player = words[1];

            string reason;
            if (words.Length > 2)
            {
                reason = string.Join(' ', words, 2, words.Length - 2);
                if (!reason.EndsWith('.'))
                {
                    reason += '.';
                }
            }
            else
            {
                reason = "unspecified.";
            }

            return new Ban()
            {
                Username = player,
                Reason = reason,
                Admin = actor,
                DateTime = DateTime.UtcNow
            };
        }

        public static Ban FromUnBanGameOutput(string content)
        {
            int index = content.IndexOf(" was unbanned by ");

            if (index < 0)
            {
                return null;
            }

            string player = content.Substring(0, index).Trim();
            string admin = content.Substring(index + 17).Trim();

            if (admin.EndsWith('.'))
            {
                admin = admin.Substring(0, admin.Length - 1);
            }

            return new Ban()
            {
                Username = player,
                Admin = admin
            };
        }

        public static Ban FromUnBanCommand(string content, string actor)
        {
            if (content.Length < 8)
            {
                return null;
            }

            string player = content.Substring(6).Trim();

            if(player == "" || player.Contains(' '))
            {
                return null;
            }

            return new Ban()
            {
                Username = player,
                Admin = actor
            };
        }
    }
}
