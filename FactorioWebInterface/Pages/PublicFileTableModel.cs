using FactorioWebInterface.Models;

namespace FactorioWebInterface.Pages
{
    public class PublicFileTableModel
    {
        public string Id { get; set; } = default!;
        public FileMetaData[] Saves { get; set; } = default!;
    }
}
