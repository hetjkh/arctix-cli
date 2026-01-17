import { ObjectId } from "mongodb";

export interface UserPreferences {
    _id?: ObjectId;
    userId: ObjectId;
    columnNames?: {
        passengerName?: string;
        route?: string;
        airlines?: string;
        serviceType?: string;
        amount?: string;
    };
    extraDeliverableColumnNames?: {
        name?: string;
        serviceType?: string;
        amount?: string;
        vatPercentage?: string;
        vat?: string;
    };
    showExtraDeliverableColumns?: {
        name?: boolean;
        serviceType?: boolean;
        amount?: boolean;
        vatPercentage?: boolean;
        vat?: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

