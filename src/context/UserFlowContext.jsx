import React, { createContext, useContext, useState } from "react";

const UserFlowContext = createContext();

export const UserFlowProvider = ({ children }) => {
    const [isFirstTimeUser, setIsFirstTimeUser] = useState(undefined);
    const [guidedMode, setGuidedMode] = useState(false);

    return (
        <UserFlowContext.Provider
            value={{ isFirstTimeUser, setIsFirstTimeUser, guidedMode, setGuidedMode }}
        >
            {children}
        </UserFlowContext.Provider>
    );
};

export const useUserFlow = () => {
    const context = useContext(UserFlowContext);
    if (!context) {
        throw new Error("useUserFlow must be used within a UserFlowProvider");
    }
    return context;
};
