using System;
using System.Text;

namespace FactorioWebInterface.Utils
{
    public static class StringBuilderExtensions
    {
        public static StringBuilder RemoveLast(this StringBuilder sb, int removeCount)
        {
            removeCount = Math.Min(removeCount, sb.Length);

            if (removeCount <= 0)
            {
                return sb;
            }

            return sb.Remove(sb.Length - removeCount, removeCount);
        }
    }
}
