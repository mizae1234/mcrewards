import { User, UserRole } from '@/types';
import { Api } from './api';
import Papa from 'papaparse'; // Typically we'd use a library, but I can implement a simple parser or just assume use of library if installed. User prompt mentioned Generator output. I'll mock the import logic for now or use a simple split. 
// Note: Since I cannot install packages, I will implement a basic CSV parser.

// Mock Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const EmployeesApi = {
    getAll: async (): Promise<User[]> => {
        await delay(300);
        return Api.getUsers();
    },

    get: async (employeeCode: string): Promise<User | undefined> => {
        await delay(200);
        return Api.getUsers().find(u => u.employeeCode === employeeCode);
    },

    create: async (user: User): Promise<User> => {
        await delay(400);
        const exists = Api.getUsers().find(u => u.employeeCode === user.employeeCode);
        if (exists) throw new Error(`Employee Code ${user.employeeCode} already exists.`);

        Api.saveUser(user);
        return user;
    },

    update: async (employeeCode: string, patch: Partial<User>): Promise<User> => {
        await delay(300);
        const user = Api.getUsers().find(u => u.employeeCode === employeeCode);
        if (!user) throw new Error("User not found");

        const updated = { ...user, ...patch };
        Api.saveUser(updated);
        return updated;
    },

    delete: async (id: string): Promise<void> => {
        await delay(300);
        Api.deleteUser(id);
    },

    // CSV Import Logic
    importCSV: async (csvText: string): Promise<{ created: number, updated: number, errors: string[] }> => {
        await delay(1000);
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error("CSV file is empty or missing header");

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Header Mapping (Thai/Eng -> keys)
        const mapHeader = (h: string) => {
            if (h.includes('code') || h.includes('id') || h.includes('รหัส')) return 'employeeCode';
            if (h.includes('first') || h.includes('ชื่อ')) return 'firstName';
            if (h.includes('last') || h.includes('สกุล')) return 'lastName';
            if (h.includes('email') || h.includes('อีเมล')) return 'email';
            if (h.includes('position') || h.includes('ตำแหน่ง')) return 'position';
            if (h.includes('bu') || h.includes('business')) return 'businessUnit';
            if (h.includes('dept') || h.includes('department') || h.includes('แผนก')) return 'department';
            if (h.includes('branch') || h.includes('สาขา')) return 'branch';
            if (h.includes('point') || h.includes('คะแนน')) return 'pointsBalance';
            if (h.includes('quota') || h.includes('โควต้า')) return 'quotaRemaining';
            return null;
        };

        const keyMap: { [index: number]: string } = {};
        headers.forEach((h, i) => {
            const key = mapHeader(h);
            if (key) keyMap[i] = key;
        });

        if (!Object.values(keyMap).includes('employeeCode')) {
            throw new Error("Missing required column: Employee Code (รหัสพนักงาน)");
        }

        let created = 0;
        let updated = 0;
        const errors: string[] = [];
        const currentUsers = Api.getUsers();

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            const userData: any = {};

            Object.keys(keyMap).forEach((colIdx: any) => {
                const key = keyMap[colIdx];
                let value: any = cols[colIdx];

                // Type conversion
                if (['pointsBalance', 'quotaRemaining'].includes(key)) {
                    value = parseInt(value) || 0;
                }
                userData[key] = value;
            });

            if (!userData.employeeCode) {
                errors.push(`Row ${i + 1}: Missing Employee Code`);
                continue;
            }

            // Defaults
            userData.role = userData.role || UserRole.STAFF; // Default to Staff if not specified
            userData.name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            userData.id = userData.id || crypto.randomUUID();
            userData.avatar = `https://ui-avatars.com/api/?name=${userData.name}&background=random`;
            userData.title = userData.title || "";

            const existingIdx = currentUsers.findIndex(u => u.employeeCode === userData.employeeCode);
            if (existingIdx >= 0) {
                // Update
                const merged = { ...currentUsers[existingIdx], ...userData };
                currentUsers[existingIdx] = merged;
                updated++;
            } else {
                // Create
                // Basic Validation
                if (!userData.firstName) {
                    errors.push(`Row ${i + 1}: Missing First Name`);
                    continue;
                }
                currentUsers.push(userData as User);
                created++;
            }
        }

        // Save all valid changes
        localStorage.setItem('mcrewards_users', JSON.stringify(currentUsers));

        return { created, updated, errors };
    }
};
