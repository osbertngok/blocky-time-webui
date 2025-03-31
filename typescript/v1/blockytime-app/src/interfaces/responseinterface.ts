interface IResponse<T> {
    data: T;
    error: string | null;
}

export default IResponse;