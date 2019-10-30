using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace FactorioWebInterface.Pages.Admin
{
    public class PlaguesPlaygroundModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManger;

        public string UserName { get; set; } = default!;
        public string FilePath { get; set; }

        public PlaguesPlaygroundModel(UserManager<ApplicationUser> userManger, IConfiguration config)
        {
            _userManger = userManger;
            FilePath = config[Constants.PlaguesScriptDefaultPathKey];
        }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "plaguesplayground");
                return RedirectToPage("signIn");
            }

            UserName = user.UserName;

            return Page();
        }
    }
}