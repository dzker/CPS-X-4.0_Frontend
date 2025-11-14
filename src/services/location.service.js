import { endpoints } from '../config/api.config';

export const locationService = {
    async getAllLocations(){
        const response = await fetch(endpoints.locations.getAll);
        if(!response.ok) throw new Error('Failed to fetch location');
        return response.json();
    },
    async getLocationById(id){
        const response = await fetch(endpoints.locations.getById(id));
        if(!response.ok) throw new Error('Failed to fetch location');
        return response.json();
    },
    async createLocation(locationData){
        const response = await fetch(endpoints.locations.create, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(locationData),
        });
        if(!response.ok) throw new Error('Failed to create location');
        return response.json();
    },
    async deleteLocation(id){
        const response = await fetch(endpoints.locations.delete(id), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if(!response.ok) throw new Error('Failed to delete location');
        return response.json();
    }
};
