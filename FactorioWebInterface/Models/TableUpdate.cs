using System.Collections.Generic;

namespace FactorioWebInterface.Models
{
    public enum TableDataType
    {
        Reset,
        Remove,
        Add,
        Update,
        Compound
    }

    public class TableData<T>
    {
        public TableDataType Type { get; set; }
        public IList<T> Rows { get; set; }
        public IList<TableData<T>> TableDatas { get; set; }
    }
}
