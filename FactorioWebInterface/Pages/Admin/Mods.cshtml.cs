using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FactorioWebInterface.Pages.Admin
{
    public class ModsModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManger;
        private readonly FactorioModManager _factorioModManager;

        public ModsModel(UserManager<ApplicationUser> userManger, FactorioModManager factorioModManager)
        {
            _userManger = userManger;
            _factorioModManager = factorioModManager;
        }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "mods");
                return RedirectToPage("signIn");
            }

            return Page();
        }

        public async Task<IActionResult> OnPostUploadFilesAsync(string modPack, List<IFormFile> files)
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "mods");
                return RedirectToPage("signIn");
            }

            if (string.IsNullOrWhiteSpace(modPack))
            {
                return BadRequest();
            }
            if (files == null || files.Count == 0)
            {
                return BadRequest();
            }

            var result = await _factorioModManager.UploadFiles(modPack, files);
            return new JsonResult(result);
        }

        public async Task<IActionResult> OnGetFileAsync(string modPack, string fileName)
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "mods");
                return RedirectToPage("signIn");
            }

            var file = _factorioModManager.GetModPackFile(modPack, fileName);

            if (file == null)
            {
                return BadRequest();
            }

            string contentType;
            switch (file.Extension)
            {
                case ".zip":
                    contentType = "application/zip";
                    break;
                case ".json":
                    contentType = "application/json";
                    break;
                default:
                    contentType = "application/octet-stream";
                    break;
            }

            return File(file.OpenRead(), contentType, file.Name);
        }
    }
}