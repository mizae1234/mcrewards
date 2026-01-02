import { Api } from './api';
import { User, UserRole } from '@/types';

export type OrgType = 'businessUnit' | 'department' | 'branch';

export interface OrgUnit {
    id: string;
    name: string;
    type: OrgType;
    memberCount: number;
}

export const OrgService = {
    // Get unique units of a specific type (BU, Dept, Branch)
    getUnits: (type: OrgType): OrgUnit[] => {
        const users = Api.getUsers();
        const unitsMap = new Map<string, number>();

        users.forEach(u => {
            if (!u[type]) return;
            const key = u[type];
            unitsMap.set(key, (unitsMap.get(key) || 0) + 1);
        });

        return Array.from(unitsMap.keys()).map(name => ({
            id: name, // Using name as ID for simplicity in this mock
            name: name,
            type: type,
            memberCount: unitsMap.get(name) || 0
        })).sort((a, b) => a.name.localeCompare(b.name));
    },

    // Get active members belonging to a specific unit
    getMembersByUnit: (type: OrgType, id: string): User[] => {
        const users = Api.getUsers();
        return users.filter(u => u[type] === id); // assuming active check isn't needed or all are active for now
    }
};
