using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;

namespace FactorioWebInterface.Pages.Admin
{
    //[Authorize(Roles = Constants.AdminRole + Constants.RootRole) ]
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

        public string UserName { get; set; } = default!;
        public bool HasPassword { get; set; }
        public bool PasswordUpdated { get; set; }

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public class InputModel
        {
            [DataType(DataType.Password)]
            [Display(Name = "Current password")]
            public string? CurrentPassword { get; set; }

            [Required]
            [StringLength(100, ErrorMessage = "The {0} must be at least {2} and at max {1} characters long.", MinimumLength = 6)]
            [DataType(DataType.Password)]
            [Display(Name = "New Password")]
            public string Password { get; set; } = default!;

            [DataType(DataType.Password)]
            [Display(Name = "Confirm new password")]
            [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
            public string ConfirmPassword { get; set; } = default!;
        }

        public async Task<IActionResult> OnGetAsync(bool passwordUpdated)
        {
            var user = await _userManager.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "account");
                return RedirectToPage("signIn");
            }

            UserName = user.UserName;

            HasPassword = await _userManager.HasPasswordAsync(user);
            PasswordUpdated = passwordUpdated;

            return Page();
        }

        public async Task<IActionResult> OnPostCreatePasswordAsync()
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
                return Page();
            }

            if (HasPassword)
            {
                return Page();
            }

            var result = await _userManager.AddPasswordAsync(user, Input.Password);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }

                return Page();
            }

            await _signInManager.SignInAsync(user, isPersistent: false);

            _logger.LogInformation($"User {user.UserName} created password");

            return RedirectToPage(new { PasswordUpdated = true });
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
                return Page();
            }

            if (!HasPassword)
            {
                return Page();
            }

            var result = await _userManager.ChangePasswordAsync(user, Input.CurrentPassword, Input.Password);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }

                return Page();
            }

            await _signInManager.SignInAsync(user, isPersistent: false);

            _logger.LogInformation($"User {user.UserName} changed password");

            return RedirectToPage(new { PasswordUpdated = true });
        }
    }
}