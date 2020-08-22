using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;

namespace FactorioWebInterface.Pages.Admin
{
    public class AccountModel : PageModel
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<AccountModel> _logger;

        public AccountModel(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ILogger<AccountModel> logger
            )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _logger = logger;
        }

        public bool HasPassword { get; set; }
        public bool PasswordUpdated { get; set; }
        public bool Error { get; set; }

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public class InputModel
        {
            [Required]
            [StringLength(100, ErrorMessage = "The {0} must be at least {2} and at max {1} characters long.", MinimumLength = 6)]
            [DataType(DataType.Password)]
            public string Password { get; set; } = default!;
        }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManager.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "account");
                return RedirectToPage("signIn");
            }

            HasPassword = await _userManager.HasPasswordAsync(user);

            PasswordUpdated = HttpContext.Session.GetString("AccountUpdated") != null;
            if (PasswordUpdated)
            {
                HttpContext.Session.Remove("AccountUpdated");
            }

            return Page();
        }

        public async Task<IActionResult> OnPostUpdatePasswordAsync()
        {
            var user = await _userManager.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "account");
                return RedirectToPage("signIn");
            }

            HasPassword = await _userManager.HasPasswordAsync(user);

            if (!ModelState.IsValid)
            {
                Error = true;
                return Page();
            }

            if (HasPassword)
            {
                var removeResult = await _userManager.RemovePasswordAsync(user);

                if (!removeResult.Succeeded)
                {
                    Error = true;
                    _logger.LogError(nameof(OnPostUpdatePasswordAsync) + "- error removing password: {errors}", removeResult.Errors);
                    Page();
                }
            }

            var addResult = await _userManager.AddPasswordAsync(user, Input.Password);

            if (!addResult.Succeeded)
            {
                Error = true;
                _logger.LogError(nameof(OnPostUpdatePasswordAsync) + "- error adding password: {errors}", addResult.Errors);
                return Page();
            }

            await _signInManager.SignInAsync(user, isPersistent: false);

            _logger.LogInformation("User {user} updated password", user.UserName);

            HttpContext.Session.SetString("AccountUpdated", "");
            return RedirectToPage();
        }
    }
}
