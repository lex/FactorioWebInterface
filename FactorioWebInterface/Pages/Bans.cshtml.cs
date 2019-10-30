using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Threading.Tasks;

namespace FactorioWebInterface.Pages
{
    public class BansModel : PageModel
    {
        private readonly IFactorioBanService _factorioBanManager;

        public BansModel(IFactorioBanService factorioBanManager)
        {
            _factorioBanManager = factorioBanManager;
        }

        public string[] Bans { get; private set; } = default!;

        public async Task<IActionResult> OnGetAsync()
        {
            Bans = await _factorioBanManager.GetBanUserNamesAsync();

            return Page();
        }
    }
}