using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System;
using System.Threading.Tasks;

namespace FactorioWebInterface.Pages.Admin
{
    public class BansModelOld : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManger;

        public BansModelOld(UserManager<ApplicationUser> userManger)
        {
            _userManger = userManger;
        }

        public class InputModel
        {
            public string Admin { get; set; } = default!;
            public string Date { get; set; } = default!;
            public string Time { get; set; } = default!;
            public bool SynchronizeWithServers { get; set; } = true;
        }

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "bans");
                return RedirectToPage("signIn");
            }

            var now = DateTime.UtcNow;

            Input = new InputModel
            {
                Admin = user.UserName,
                Date = now.ToString("yyyy-MM-dd"),
                Time = now.ToString("HH:mm:ss"),
            };

            return Page();
        }
    }
}