using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Threading.Tasks;

namespace FactorioWebInterface.Pages.Admin
{
    public class AdminsModelOld : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManger;

        public AdminsModelOld(UserManager<ApplicationUser> userManger)
        {
            _userManger = userManger;
        }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "admins");
                return RedirectToPage("signIn");
            }

            return Page();
        }
    }
}