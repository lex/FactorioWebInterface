using System.Data;

namespace FactorioWebInterface
{
    public static class Constants
    {
        public const string ServerURLKey = "ServerURL";
        public const string RootRole = "Root";
        public const string AdminRole = "Admin";
        public const string DiscordBotTokenKey = "DiscordBotToken";
        public const string ClientIDKey = "ClientID";
        public const string ClientSecretKey = "ClientSecret";
        public const string GuildIDKey = "GuildID";
        public const string AdminRolesKey = "AdminRoles";
        public const string CrashRoleKey = "CrashRole";
        public const string AdminChannelID = "ADMIN";
        public const string SecurityKey = "SecurityKey";
        public const string FactorioWrapperClaim = "FactorioWrapper";
        public const string ServerSettingsUsernameKey = "serverSettingsUsername";
        public const string ServerSettingsTokenKey = "serverSettingsToken";
        public const string FactorioWrapperNameKey = "FactorioWrapperNameKey";
        public const string GitHubCallbackFilePathKey = "WebHookGitHubCallbackFile";
        public const string PlaguesScriptDefaultPathKey = "PlaguesScriptDefaultPath";

        public const string DiscordBotCommandPrefix = ";;";

        public const string TempSavesDirectoryName = "saves";
        public const string LocalSavesDirectoryName = "local_saves";
        public const string GlobalSavesDirectoryName = "global_saves";
        public const string PublicDirectoryName = "public";
        public const string ScenarioDirectoryName = "scenarios";
        public const string LogDirectoryName = "logs";
        public const string LogArchiveDirectoryName = "archive_logs";
        public const string CurrentLogName = "factorio-current";
        public const string CurrentLogFileName = "factorio-current.log";
        public const string ChatLogDirectoryName = "chat_logs";
        public const string CurrentChatLogName = "chat-current.log";
        public const string ArchiveDirectoryName = "archive";
        public const string ModsDirectoryName = "mods";

        public const string FactorioLoadSaveFlag = "--start-server";
        public const string FactorioLoadLatestSaveFlag = "--start-server-load-latest";
        public const string FactorioStartScenarioFlag = "--start-server-load-scenario";

        public const string FactorioSaveExtension = ".zip";
        public const string FactorioSaveSearchPattern = "*.zip";

#if WINDOWS
        public const string ExecutablePath = "bin/x64/factorio.exe";
#else
        public const string ExecutablePath = "bin/x64/factorio";
#endif

#if WINDOWS
        public const string DotNetPath = "C:/Program Files/dotnet/dotnet.exe";
#elif WSL
        public const string DotNetPath = "/usr/bin/dotnet";            
#else
        public const string DotNetPath = "/usr/bin/dotnet";
#endif

        public const string WindowsPublicStartSavesDirectoryName = "public\\start";
        public const string WindowsPublicFinalSavesDirectoryName = "public\\final";
        public const string WindowsPublicOldSavesDirectoryName = "public\\old";
        public const string PublicStartSavesDirectoryName = "public/start";
        public const string PublicFinalSavesDirectoryName = "public/final";
        public const string PublicOldSavesDirectoryName = "public/old";
        public const string UpdateCacheDirectoryName = "update_cache";

        public const string DownloadArchiveURL = @"https://factorio.com/download/archive";
        public const string GetDownloadURL = @"https://factorio.com/get-download/";
        public const string ModPortalApi = @"https://mods.factorio.com/api/mods";
        public const string ModPortalUrl = @" https://mods.factorio.com";

        //public const string DefaultFileName = "current_map.zip";
        public const string ServerSettingsFileName = "server-settings.json";
        public const string ServerRunningSettingsFileName = "server-running-settings.json";
        public const string ServerExtraSettingsFileName = "server-extra-settings.json";
        public const string ServerBanListFileName = "server-banlist.json";
        public const string ServerAdminListFileName = "server-adminlist.json";

        public const int discordTopicMaxLength = 1024;
        public const int discordMaxMessageLength = 2000;

        public const string ServerPlayerName = "<server>";

        public const string ChatTag = "[CHAT]";
        public const string ShoutTag = "[SHOUT]";
        public const string DiscordTag = "[DISCORD]";
        public const string DiscordRawTag = "[DISCORD-RAW]";

        // Sanitize string then make bold.
        public const string DiscordBold = "[DISCORD-BOLD]";
        public const string DiscordAdminTag = "[DISCORD-ADMIN]";
        public const string DiscordAdminRawTag = "[DISCORD-ADMIN-RAW]";
        public const string JoinTag = "[JOIN]";
        public const string LeaveTag = "[LEAVE]";
        public const string PlayerJoinTag = "[PLAYER-JOIN]";
        public const string PlayerLeaveTag = "[PLAYER-LEAVE]";
        public const string DiscordEmbedTag = "[DISCORD-EMBED]";
        public const string DiscordEmbedRawTag = "[DISCORD-EMBED-RAW]";
        public const string DiscordAdminEmbedTag = "[DISCORD-ADMIN-EMBED]";
        public const string DiscordAdminEmbedRawTag = "[DISCORD-ADMIN-EMBED-RAW]";
        public const string StartScenarioTag = "[START-SCENARIO]";
        public const string BanTag = "[BAN]";
        public const string UnBannedTag = "[UNBANNED]";
        public const string BanSyncTag = "[BAN-SYNC]";
        public const string UnBannedSyncTag = "[UNBANNED-SYNC]";
        public const string PingTag = "[PING]";
        public const string DataSetTag = "[DATA-SET]";
        public const string DataGetTag = "[DATA-GET]";
        public const string DataGetAllTag = "[DATA-GET-ALL]";
        public const string DataTrackedTag = "[DATA-TRACKED]";
        public const string QueryPlayersTag = "[QUERY-PLAYERS]";

        public const string UnexpectedErrorKey = "unexpectedError";
        public const string ServerIdErrorKey = "serverId";
        public const string WrapperProcessErrorKey = "wrapperProcess";
        public const string InvalidServerStateErrorKey = "invalidState";
        public const string MissingFileErrorKey = "missingFile";
        public const string MissingDirectoryErrorKey = "missingDirectory";
        public const string InvalidFileTypeErrorKey = "invalidFileType";
        public const string FileAlreadyExistsErrorKey = "fileAlreadyExists";
        public const string FileErrorKey = "fileError";
        public const string InvalidFileNameErrorKey = "invalidFileName";
        public const string InvalidDirectoryErrorKey = "invalidDirectory";
        public const string UpdateErrorKey = "updateError";
        public const string NotSupportedErrorKey = "notSupportedError";
        public const string RequiredFieldErrorKey = "requiredField";
        public const string FailedToAddBanToDatabaseErrorKey = "failedToAddBanToDatabase";
        public const string FailedToRemoveBanFromDatabaseErrorKey = "failedToRemoveBanFromDatabase";
        public const string FailedToAddAdminsErrorKey = "failedToAddAdminsErrorKey";
        public const string FailedToRemoveAdminErrorKey = "failedToRemoveAdminErrorKey";
        public const string InvalidModNameKeyErrorKey = "invalidModNameKey";
        public const string InvalidHttpResponseErrorKey = "invalidHttpResponse";
        public const string InvalidReleaseDataErrorKey = "InvalidReleaseData";
        public const string MissingModErrorKey = "missingMod";
        public const string MissingVersionErrorKey = "missingVersion";
    }
}
