using System;

namespace FactorioWebInterface.Models
{
    public class ModPackFileMetaData
    {
        private static readonly string[] sizes = { "B", "KB", "MB", "GB", "TB" };

        public string Name { get; set; }
        public DateTime CreatedTime { get; set; }
        public DateTime LastModifiedTime { get; set; }
        public long Size { get; set; }

        public string GetSizeHumanReadable()
        {
            //https://stackoverflow.com/questions/281640/how-do-i-get-a-human-readable-file-size-in-bytes-abbreviation-using-net

            double size = Size;
            int order = 0;
            while (size >= 1024 && order < sizes.Length - 1)
            {
                order++;
                size = size / 1024;
            }

            // Adjust the format string to your preferences. For example "{0:0.#}{1}" would
            // show a single decimal place, and no space.
            return string.Format("{0:0.##} {1}", size, sizes[order]);
        }
    }
}
