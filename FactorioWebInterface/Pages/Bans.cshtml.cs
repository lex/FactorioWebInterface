using FactorioWebInterface.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Threading.Tasks;

namespace FactorioWebInterface.Pages
{
    public class BansModel : PageModel
    {
        private readonly FactorioBanManager _factorioBanManager;

        public BansModel(FactorioBanManager factorioBanManager)
        {
            _factorioBanManager = factorioBanManager;
        }

        public string[] Bans { get; private set; }

        public async Task<IActionResult> OnGetAsync()
        {
            Bans = await _factorioBanManager.GetBanUserNamesAsync();

            return Page();
        }
    }
}