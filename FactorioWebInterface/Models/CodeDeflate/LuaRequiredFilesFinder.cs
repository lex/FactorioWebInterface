using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace FactorioWebInterface.Models.CodeDeflate
{
    public class LuaRequiredFilesFinder
    {
        private enum TokenType
        {
            None,
            Identifier,
            StringChar,
            PreStringMultiLine,
            StringMultiLine,
            PreComment,
            CommentSingleLine,
            CommentMultiLine,
        }

        private readonly char[] buffer;
        private string? endTokenString;
        private char endTokenChar;
        private TokenType tokenType;
        private int bufferIndex;
        private int stateIndex = 0;
        private bool escaped = false;
        bool skipWhiteSpace = false;
        private readonly StringBuilder stringBuilder = new StringBuilder();

        private readonly char directorySeparatorChar;

        private bool hasPreviousRequire;

        public List<string> Requires { get; } = new List<string>();

        public LuaRequiredFilesFinder(char directorySeparatorChar = '/', int bufferSize = 8192)
        {
            if (bufferSize < 1)
            {
                throw new ArgumentException($"{nameof(bufferSize)} can not be less than 1.", nameof(bufferSize));
            }

            buffer = new char[bufferSize];
            this.directorySeparatorChar = directorySeparatorChar;
        }

        public static List<string> GetAllRequiredFiles(Stream stream, char directorySeparatorChar = '/', int bufferSize = 8192)
        {
            var parser = new LuaRequiredFilesFinder(directorySeparatorChar, bufferSize);
            parser.ParseStream(stream);

            return parser.Requires;
        }

        public void ParseStream(Stream stream)
        {
            endTokenString = null;
            endTokenChar = '\0';
            tokenType = TokenType.None;
            stringBuilder.Clear();
            Requires.Clear();

            using var reader = new StreamReader(stream, leaveOpen: true);
            while (reader.ReadBlock(buffer, 0, buffer.Length) is int read && read > 0)
            {
                ParseBuffer(read);
            }
        }

        private void ParseBuffer(int read)
        {
            for (bufferIndex = 0; bufferIndex < read && bufferIndex < buffer.Length;)
            {
                switch (tokenType)
                {
                    case TokenType.None:
                        ParseNone(read);
                        break;
                    case TokenType.Identifier:
                        ParseIdentifier(read);
                        break;
                    case TokenType.StringChar:
                        ParseStringChar(read);
                        break;
                    case TokenType.PreStringMultiLine:
                        ParsePreStringMultiLine(read);
                        break;
                    case TokenType.StringMultiLine:
                        ParseStringMultiLine(read);
                        break;
                    case TokenType.PreComment:
                        ParsePreComment(read);
                        break;
                    case TokenType.CommentSingleLine:
                        ParseCommentSingleLine(read);
                        break;
                    case TokenType.CommentMultiLine:
                        ParseCommentMultiLine(read);
                        break;
                    default:
                        throw new InvalidOperationException();
                };
            }
        }

        private void ParseNone(int read)
        {
            for (; bufferIndex < read && bufferIndex < buffer.Length; bufferIndex++)
            {
                char firstChar = buffer[bufferIndex];

                if (firstChar == '"')
                {
                    tokenType = TokenType.StringChar;
                    endTokenChar = '"';
                    skipWhiteSpace = false;
                    escaped = false;

                    bufferIndex++;
                    return;
                }

                if (firstChar == '\'')
                {
                    tokenType = TokenType.StringChar;
                    endTokenChar = '\'';
                    skipWhiteSpace = false;
                    escaped = false;

                    bufferIndex++;
                    return;
                }

                if (firstChar == '[')
                {
                    stringBuilder.Append(']');
                    tokenType = TokenType.PreStringMultiLine;

                    bufferIndex++;
                    return;
                }

                if (firstChar == '-')
                {
                    tokenType = TokenType.PreComment;
                    stateIndex = 1;

                    bufferIndex++;
                    return;
                }

                if (IsStartIdentifier(firstChar))
                {
                    tokenType = TokenType.Identifier;
                    stateIndex = firstChar == 'r' ? 1 : 0;

                    bufferIndex++;
                    return;
                }
            }

            return;
        }

        private void ParsePreStringMultiLine(int read)
        {
            for (; bufferIndex < read && bufferIndex < buffer.Length; bufferIndex++)
            {
                char c = buffer[bufferIndex];

                if (c == '[')
                {
                    stringBuilder.Append(']');
                    endTokenString = stringBuilder.ToString();
                    stringBuilder.Clear();
                    stateIndex = 0;
                    tokenType = TokenType.StringMultiLine;
                    skipWhiteSpace = true;

                    bufferIndex++;
                    return;
                }

                if (c == '=')
                {
                    stringBuilder.Append('=');
                    continue;
                }

                stringBuilder.Clear();
                tokenType = TokenType.None;
                hasPreviousRequire = false;

                return;
            }
        }

        private void ParseIdentifier(int read)
        {
            for (; bufferIndex < read && bufferIndex < buffer.Length; bufferIndex++)
            {
                char c = buffer[bufferIndex];

                switch (stateIndex)
                {
                    case 0:
                        if (IsIdentifier(c))
                        {
                            continue;
                        }

                        tokenType = TokenType.None;
                        hasPreviousRequire = false;
                        return;
                    case 1:
                        if (c == 'e')
                        {
                            stateIndex++;
                            continue;
                        }

                        stateIndex = 0;
                        break;
                    case 2:
                        if (c == 'q')
                        {
                            stateIndex++;
                            continue;
                        }

                        stateIndex = 0;
                        break;
                    case 3:
                        if (c == 'u')
                        {
                            stateIndex++;
                            continue;
                        }

                        stateIndex = 0;
                        break;
                    case 4:
                        if (c == 'i')
                        {
                            stateIndex++;
                            continue;
                        }

                        stateIndex = 0;
                        break;
                    case 5:
                        if (c == 'r')
                        {
                            stateIndex++;
                            continue;
                        }

                        stateIndex = 0;
                        break;
                    case 6:
                        if (c == 'e')
                        {
                            stateIndex++;
                            continue;
                        }

                        stateIndex = 0;
                        break;
                    case 7:
                        if (IsIdentifier(c))
                        {
                            stateIndex = 0;
                            continue;
                        }

                        tokenType = TokenType.None;
                        hasPreviousRequire = true;
                        return;
                    default:
                        throw new InvalidOperationException();
                }
            }
        }

        private void ParseStringChar(int read)
        {
            if (hasPreviousRequire)
            {
                RecordStringChar(read);
            }
            else
            {
                RunToEndStringChar(read);
            }
        }

        private void RecordStringChar(int read)
        {
            for (; bufferIndex < read && bufferIndex < buffer.Length; bufferIndex++)
            {
                char c = buffer[bufferIndex];

                if (skipWhiteSpace)
                {
                    if (char.IsWhiteSpace(c))
                    {
                        continue;
                    }

                    skipWhiteSpace = false;
                }

                if (escaped)
                {
                    if (c == 'z')
                    {
                        skipWhiteSpace = true;
                        continue;
                    }

                    AppendChar(c);
                    escaped = false;
                    continue;
                }

                if (c == '\\')
                {
                    escaped = true;
                    continue;
                }

                if (c == endTokenChar)
                {
                    tokenType = TokenType.None;
                    hasPreviousRequire = false;

                    AddRequiredFile();

                    bufferIndex++;
                    return;
                }

                AppendChar(c);
            }
        }

        private void RunToEndStringChar(int read)
        {
            for (; bufferIndex < read && bufferIndex < buffer.Length; bufferIndex++)
            {
                if (escaped)
                {
                    escaped = false;
                    continue;
                }

                char c = buffer[bufferIndex];

                if (c == '\\')
                {
                    escaped = true;
                    continue;
                }

                if (c == endTokenChar)
                {
                    tokenType = TokenType.None;
                    bufferIndex++;
                    return;
                }
            }
        }

        private void AppendChar(char c)
        {
            switch (c)
            {
                case '\\':
                case '/':
                case '.':
                    stringBuilder.Append(directorySeparatorChar);
                    break;
                default:
                    stringBuilder.Append(c);
                    break;
            }
        }

        private void ParseStringMultiLine(int read)
        {
            if (hasPreviousRequire)
            {
                RecordStringMultiLine(read);
            }
            else
            {
                RunToEndStringMultiLine(read);
            }
        }

        private void RecordStringMultiLine(int read)
        {
            for (; bufferIndex < read && bufferIndex < buffer.Length; bufferIndex++)
            {
                char c = buffer[bufferIndex];

                // Here skip whitespace is really skip first line, which is either \n, \r, \n\r or \r\n.
                if (skipWhiteSpace)
                {
                    if (c != '\n' && c != '\r')
                    {
                        stringBuilder.Length = 0;
                        skipWhiteSpace = false;
                    }
                    else
                    {
                        if (stringBuilder.Length == 0)
                        {
                            stringBuilder.Append(c);
                            continue;
                        }

                        skipWhiteSpace = false;

                        if (c != stringBuilder[0])
                        {
                            stringBuilder.Length = 0;
                        }

                        continue;
                    }
                }

                AppendChar(c);

                if (endTokenString![stateIndex] != c)
                {
                    stateIndex = 0;
                    continue;
                }

                stateIndex++;

                if (stateIndex == endTokenString!.Length)
                {
                    tokenType = TokenType.None;
                    hasPreviousRequire = false;

                    stringBuilder.Length -= endTokenString.Length;
                    AddRequiredFile();

                    bufferIndex++;
                    return;
                }
            }
        }

        private void RunToEndStringMultiLine(int read)
        {
            for (; bufferIndex < read && bufferIndex < buffer.Length; bufferIndex++)
            {
                if (endTokenString![stateIndex] != buffer[bufferIndex])
                {
                    stateIndex = 0;
                    continue;
                }

                stateIndex++;

                if (stateIndex == endTokenString!.Length)
                {
                    tokenType = TokenType.None;
                    bufferIndex++;
                    return;
                }
            }
        }

        private void ParsePreComment(int read)
        {
            for (; bufferIndex < read && bufferIndex < buffer.Length; bufferIndex++)
            {
                char c = buffer[bufferIndex];

                switch (stateIndex)
                {
                    case 1:
                        if (c == '-')
                        {
                            stateIndex++;
                            continue;
                        }

                        tokenType = TokenType.None;
                        hasPreviousRequire = false;
                        return;
                    case 2:
                        if (c == '[')
                        {
                            stateIndex++;
                            continue;
                        }

                        tokenType = TokenType.CommentSingleLine;
                        bufferIndex++;
                        return;
                    case 3:
                        if (c == '[')
                        {
                            tokenType = TokenType.CommentMultiLine;
                            stateIndex = 0;

                            bufferIndex++;
                            return;
                        }

                        tokenType = TokenType.CommentSingleLine;
                        bufferIndex++;
                        return;
                    default:
                        throw new InvalidOperationException();
                }
            }
        }

        private void ParseCommentSingleLine(int read)
        {
            for (; bufferIndex < read && bufferIndex < buffer.Length; bufferIndex++)
            {
                char c = buffer[bufferIndex];
                if (c == '\n' || c == '\r')
                {
                    tokenType = TokenType.None;
                    bufferIndex++;
                    return;
                }
            }
        }

        private void ParseCommentMultiLine(int read)
        {
            for (; bufferIndex < read && bufferIndex < buffer.Length; bufferIndex++)
            {
                if (buffer[bufferIndex] != ']')
                {
                    stateIndex = 0;
                    continue;
                }

                if (stateIndex == 1)
                {
                    tokenType = TokenType.None;
                    bufferIndex++;
                    return;
                }

                stateIndex++;
            }
        }

        private static bool IsStartIdentifier(char c) => char.IsLetter(c) || c == '_';
        private static bool IsIdentifier(char c) => char.IsLetterOrDigit(c) || c == '_';

        private void AddRequiredFile()
        {
            string fileName = stringBuilder.ToString();

            if (fileName != "")
            {
                Requires.Add(fileName);
            }

            stringBuilder.Clear();
        }
    }
}
