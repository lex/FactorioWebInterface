using System.Text;

namespace FactorioWebInterface.Services.Utils
{
    public sealed class TextBatcher
    {
        private readonly int capacity;
        private readonly StringBuilder stringBuilder;

        public TextBatcher(int capacity)
        {
            this.capacity = capacity;
            stringBuilder = new StringBuilder(capacity);
        }

        public bool TryAdd(string text)
        {
            int free = capacity - stringBuilder.Length;
            bool addNewLine = false;
            if (free != capacity)
            {
                free--;
                addNewLine = true;
            }

            if (text.Length > free)
            {
                return false;
            }

            if (addNewLine)
            {
                stringBuilder.Append('\n');
            }

            stringBuilder.Append(text);
            return true;
        }

        public string MakeBatch()
        {
            string batch = stringBuilder.ToString();
            stringBuilder.Clear();
            return batch;
        }
    }
}
