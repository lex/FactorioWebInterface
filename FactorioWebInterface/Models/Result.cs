using FactorioWebInterface.Utils;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json.Serialization;

namespace FactorioWebInterface.Models
{
    public class Error : IEquatable<Error>
    {
        public string Key { get; }
        public string Description { get; }

        public Error(string key, string description = "")
        {
            Key = key;
            Description = description;
        }

        public override bool Equals(object? obj)
        {
            return Equals(obj as Error);
        }

        public bool Equals(Error? other)
        {
            return other != null &&
                   Key == other.Key &&
                   Description == other.Description;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Key, Description);
        }

        public static bool operator ==(Error? left, Error? right)
        {
            return EqualityComparer<Error>.Default.Equals(left, right);
        }

        public static bool operator !=(Error? left, Error? right)
        {
            return !(left == right);
        }

        public override string ToString() => $"{Key}: {Description}";
    }

    public class Result : IEquatable<Result>
    {
        public static Result OK { get; } = new Result(true, new Error[0]);

        public static Result Failure(Error error) => new Result(false, new Error[] { error });
        public static Result Failure(IReadOnlyList<Error> errors) => new Result(false, errors);
        public static Result Failure(string key, string description = "") => Failure(new Error(key, description));

        [JsonProperty(PropertyName = "Success")]
        [JsonPropertyName("Success")]
        public bool Success { get; }

        [JsonProperty(PropertyName = "Errors")]
        [JsonPropertyName("Errors")]
        public IReadOnlyList<Error> Errors { get; }

        public Result(bool success, IReadOnlyList<Error> errors)
        {
            Success = success;
            Errors = errors;
        }

        public static Result Combine(IReadOnlyList<Result> results)
        {
            var errors = new List<Error>();

            foreach (var result in results)
            {
                errors.AddRange(result.Errors);
            }

            return new Result(errors.Count == 0, errors);
        }

        public static Result Combine(params Result[] results) => Combine((IReadOnlyList<Result>)results);

        public override string ToString()
        {
            if (Success)
            {
                return "OK";
            }
            else
            {
                var sb = new StringBuilder();
                foreach (var error in Errors)
                {
                    sb.Append(error.Key).Append(": ").AppendLine(error.Description);
                }
                sb.RemoveLast(Environment.NewLine.Length);

                return sb.ToString();
            }
        }

        public override bool Equals(object? obj)
        {
            return Equals(obj as Result);
        }

        public bool Equals(Result? other)
        {
            return other != null &&
                   Success == other.Success &&
                   EqualityComparer<IReadOnlyList<Error>>.Default.Equals(Errors, other.Errors);
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Success, Errors);
        }

        public static bool operator ==(Result? left, Result? right)
        {
            return EqualityComparer<Result>.Default.Equals(left, right);
        }

        public static bool operator !=(Result? left, Result? right)
        {
            return !(left == right);
        }
    }

    public class Result<T> : Result
    {
        public static new Result<T> OK(T value) => new Result<T>(value);
        public static new Result<T> Failure(Error error) => new Result<T>(new Error[] { error });
        public static new Result<T> Failure(IReadOnlyList<Error> errors) => new Result<T>(errors);
        public static new Result<T> Failure(string key, string description = "") => Failure(new Error(key, description));

        private Result(IReadOnlyList<Error> errors) : base(false, errors)
        {
        }

        private Result(T value) : base(true, new Error[0])
        {
            Value = value;
        }

        public Result(T value, bool success, IReadOnlyList<Error> errors) : base(success, errors)
        {
            Value = value;
        }

        [MaybeNull]
        [JsonProperty(PropertyName = "Value")]
        [JsonPropertyName("Value")]
        public T Value { get; set; } = default!;

        public static Result<T> FromResult(Result result)
        {
            if (result is Result<T> r)
            {
                return r;
            }
            else if (result.Success)
            {
                throw new InvalidCastException($"Can not convert {nameof(Result)} to {nameof(Result<T>)} when result is not in success state, unless {nameof(result)} is castable to {nameof(Result<T>)}.");
            }
            else
            {
                return Failure(result.Errors);
            }
        }
    }
}
