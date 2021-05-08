using Microsoft.AspNetCore.SignalR;
using System.Diagnostics.CodeAnalysis;

namespace FactorioWebInterface.Utils
{
    public static class HubCallerContextExtensions
    {
        public static T GetDataOrDefault<T>(this HubCallerContext context, T defaultValue = default!)
        {
            if (context.Items.TryGetValue(typeof(T), out object? data))
            {
                return (T)data!;
            }
            else
            {
                return defaultValue;
            }
        }

        public static bool TryGetData<T>(this HubCallerContext context, [MaybeNullWhen(false)] out T data)
        {
            if (context.Items.TryGetValue(typeof(T), out object? obj))
            {
                data = (T)obj!;
                return true;
            }
            else
            {
                data = default!;
                return false;
            }
        }

        public static void SetData<T>(this HubCallerContext context, T value)
        {
            context.Items[typeof(T)] = value;
        }

        public static bool RemoveData<T>(this HubCallerContext context)
        {
            return context.Items.Remove(typeof(T));
        }
    }
}
