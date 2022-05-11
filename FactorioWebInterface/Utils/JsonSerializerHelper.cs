using System;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

namespace FactorioWebInterface.Utils
{
    public static class JsonSerializerHelper
    {
        private static JsonSerializerOptions JsonSerializerOptions = new JsonSerializerOptions()
        {
            AllowTrailingCommas = true,
            PropertyNameCaseInsensitive = true,
            ReadCommentHandling = JsonCommentHandling.Skip
        };

        public static bool TryDeserialize<T>(string text, [MaybeNullWhen(false)] out T value)
        {
            try
            {
                if (JsonSerializer.Deserialize<T>(text, JsonSerializerOptions) is T obj)
                {
                    value = obj;
                    return true;
                }
            }
            catch (Exception)
            {
            }

            value = default;
            return false;
        }
    }
}
