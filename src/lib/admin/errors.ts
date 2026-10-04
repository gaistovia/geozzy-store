/** An error whose message is safe and useful to show to the store owner. */
export class AdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminError";
  }
}

interface DbErrorLike {
  code?: string;
  message?: string;
  details?: string;
}

/** Turns a database error into a plain-language message. */
export function dbError(error: DbErrorLike, fallback = "Something went wrong. Please try again."): AdminError {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  switch (error.code) {
    case "23505":
      if (/slug/.test(text)) return new AdminError("That web address (slug) is already used. Please choose another.");
      if (/sku/.test(text)) return new AdminError("That SKU is already used by another product.");
      if (/product_variants_unique_combo/.test(text)) return new AdminError("That size/color already exists for this product.");
      return new AdminError("That value is already in use.");
    case "23503":
      return new AdminError("This item is still linked to other data, so the change was not made.");
    case "23514":
      if (/published_needs_category/.test(text)) return new AdminError("A published product needs a category. Choose a category first.");
      if (/sale_price/.test(text) || /products_check/.test(text)) return new AdminError("The sale price must be lower than the regular price.");
      if (/promotion_dates_valid/.test(text)) return new AdminError("The end date must be after the start date.");
      return new AdminError("One of the values is not allowed. Please check the form.");
    case "42501":
    case "PGRST301":
      return new AdminError("You do not have permission to do this.");
    default:
      return new AdminError(fallback);
  }
}

export function messageOf(error: unknown): string {
  if (error instanceof AdminError) return error.message;
  return "Something went wrong. Please try again.";
}
