export interface DialogLine {
    speaker?: string;
    text: string;
    portrait?: string;
}

export interface DialogChoice {
    text: string;
    nextDialogId?: string;
    karmaEffect?: number;
    temptationEffect?: number;
    action?: string;
}

export interface Dialog {
    id: string;
    lines: DialogLine[];
    choices?: DialogChoice[];
    onComplete?: string;
}

export interface DialogState {
    isActive: boolean;
    currentDialog: Dialog | null;
    lineIndex: number;
    isTyping: boolean;
    displayedText: string;
}
