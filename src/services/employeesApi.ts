// Frontend API service to connect to the backend
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export interface Employee {
    id: string;
    employeeCode: string;
    email: string;
    fullname: string;
    position: string;
    businessUnit: string;
    department: string;
    branch: string;
    role: string;
    quota: number;
    pointsBalance: number;
    avatar?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const EmployeesApiClient = {
    async getAll(): Promise<Employee[]> {
        const res = await fetch(`${API_BASE}/employees`);
        if (!res.ok) throw new Error('Failed to fetch employees');
        return res.json();
    },

    async getById(id: string): Promise<Employee> {
        const res = await fetch(`${API_BASE}/employees/${id}`);
        if (!res.ok) throw new Error('Failed to fetch employee');
        return res.json();
    },

    async create(data: Partial<Employee>): Promise<Employee> {
        const res = await fetch(`${API_BASE}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create employee');
        }
        return res.json();
    },

    async update(id: string, data: Partial<Employee>): Promise<Employee> {
        const res = await fetch(`${API_BASE}/employees/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to update employee');
        }
        return res.json();
    },

    async delete(id: string): Promise<void> {
        const res = await fetch(`${API_BASE}/employees/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete employee');
    },

    async importExcel(file: File): Promise<{ created: number; updated: number; errors: string[]; total: number }> {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/employees/import`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to import');
        }
        return res.json();
    }
};
