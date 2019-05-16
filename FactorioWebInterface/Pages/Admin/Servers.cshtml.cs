﻿using FactorioWebInterface.Data;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FactorioWebInterface.Pages.Admin
{
    public class ServersModel : PageModel
    {
        public static readonly FileTableModel tempSaves = new FileTableModel() { Name = "Temp Saves", Id = "tempSaveFilesTable" };
        public static readonly FileTableModel localSaves = new FileTableModel() { Name = "Local Saves", Id = "localSaveFilesTable" };
        public static readonly FileTableModel globalSaves = new FileTableModel() { Name = "Global Saves", Id = "globalSaveFilesTable" };

        private readonly UserManager<ApplicationUser> _userManger;
        private readonly FactorioFileManager _factorioFileManager;
        private readonly ILogger<ServersModel> _logger;

        public ServersModel(UserManager<ApplicationUser> userManger, FactorioFileManager factorioFileManager, ILogger<ServersModel> logger)
        {
            _userManger = userManger;
            _factorioFileManager = factorioFileManager;
            _logger = logger;
        }

        public class InputModel
        {
            public string Id { get; set; }
        }

        //[BindProperty]
        //public InputModel Input { get; set; }

        public int Id { get; set; }

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            Id = id ?? 1;

            var user = await _userManger.GetUserAsync(User);

            if (Id < 1 || Id > FactorioServerData.serverCount)
            {
                return RedirectToPage("Servers", 1);
            }

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "servers/" + Id);
                return RedirectToPage("signIn");
            }

            return Page();
        }

        public async Task<IActionResult> OnGetFile(string serverId, string directory, string name)
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "servers/" + Id);
                return RedirectToPage("signIn");
            }

            var file = _factorioFileManager.GetSaveFile(serverId, directory, name);
            if (file == null)
            {
                return BadRequest();
            }

            return File(file.OpenRead(), "application/zip", file.Name);
        }

        public async Task<IActionResult> OnGetLogFile(string directory, string name)
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "servers/" + Id);
                return RedirectToPage("signIn");
            }

            var file = _factorioFileManager.GetLogFile(directory, name);
            if (file == null)
            {
                return BadRequest();
            }

            try
            {
                return File(file.OpenRead(), "application/text", file.Name);
            }
            catch
            {
                return BadRequest();
            }
        }

        public async Task<IActionResult> OnGetChatLogFile(string directory, string name)
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "servers/" + Id);
                return RedirectToPage("signIn");
            }

            var file = _factorioFileManager.GetChatLogFile(directory, name);
            if (file == null)
            {
                return BadRequest();
            }

            try
            {
                return File(file.OpenRead(), "application/text", file.Name);
            }
            catch
            {
                return BadRequest();
            }
        }

        public async Task<IActionResult> OnPostFileUploadAsync(string serverId, List<IFormFile> files)
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "servers/" + Id);
                return RedirectToPage("signIn");
            }

            if (string.IsNullOrWhiteSpace(serverId))
            {
                return BadRequest();
            }
            if (files == null || files.Count == 0)
            {
                return BadRequest();
            }

            var result = await _factorioFileManager.UploadFiles(serverId, files);

            return new JsonResult(result);
        }
    }
}