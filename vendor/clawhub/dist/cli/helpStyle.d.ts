export declare function styleTitle(value: string): string;
export declare function configureCommanderHelp(program: {
    configureHelp: (config: {
        sectionTitle?: (title: string) => string;
        optionTerm?: (option: {
            flags: string;
        }) => string;
        commandTerm?: (cmd: {
            name: () => string;
        }) => string;
    }) => unknown;
}): void;
export declare function styleEnvBlock(value: string): string;
