export const paginate = (items, page, limit) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = {};

    if (endIndex < items.length) {
        result.next = {
            page: page + 1,
            limit: limit,
        };
    }

    if (startIndex > 0) {
        result.previous = {
            page: page - 1,
            limit: limit,
        };
    }

    result.results = items.slice(startIndex, endIndex);
    return result;
};