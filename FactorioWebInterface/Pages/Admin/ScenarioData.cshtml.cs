using System.Threading.Tasks;
using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FactorioWebInterface.Pages.Admin
{
    public class ScenarioDataModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManger;

        public ScenarioDataModel(UserManager<ApplicationUser> userManger)
        {
            _userManger = userManger;
        }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "scenariodata/");
                return RedirectToPage("signIn");
            }

            return Page();
        }
    }
}