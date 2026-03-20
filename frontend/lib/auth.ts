import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const setTokens = (access: string, refresh: string) => {
    Cookies.set(ACCESS_TOKEN_KEY, access, { expires: 1 }); // 1 day
    Cookies.set(REFRESH_TOKEN_KEY, refresh, { expires: 7 }); // 7 days
};

export const getAccessToken = (): string | undefined =>
    Cookies.get(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | undefined =>
    Cookies.get(REFRESH_TOKEN_KEY);

export const clearTokens = () => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
};
