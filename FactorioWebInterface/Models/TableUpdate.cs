using System.Collections.Generic;

namespace FactorioWebInterface.Models
{
    public enum TableDataType
    {
        Reset,
        Remove,
        Add,
        Update
    }

    public class TableData<T>
    {
        public TableDataType Type { get; set; }
        public IList<T> Rows { get; set; }
    }
}
