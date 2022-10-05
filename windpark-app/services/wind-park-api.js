const axios = require('axios');
const windParkApiUrl = process.env.WIND_PARK_API_URL;
const retrieveDataInterval = process.env.RETRIEVE_DATA_INTERVAL || 1000; // default to 1 second
const aggregationTimeInterval = process.env.AGGREGATION_TIME_INTERVAL || 5 * 60000; // default to 5 minutes

module.exports = class WindParkApiService {
    _aggregateData = [{recorded_timestamp: Date.now(), data: []}];
    _aggregatedValue;
    _axiosClient;

    constructor() {
        this._axiosClient = axios.create({
            baseURL: windParkApiUrl
        });
    }

    async _retrieveData() {
        const data = await this.getAllSites();
        this._aggregateData[this._aggregateData.length - 1].data.push(data);
    }

    calculateAggregatedValue() {
        // aggregate the latest record into a summary report
        const {
            recorded_timestamp,
            data: sitesData
        } = JSON.parse(JSON.stringify(this._aggregateData[this._aggregateData.length - 1]));
        const sites = {};

        for (let record of sitesData) {
            for (let site of record) {
                const _site = sites[site.Id];
                if (!_site) {
                    site.Turbines = site.Turbines.map(turbine => ({...turbine, count: 1}))
                    sites[site.Id] = site;
                } else {
                    for (let turbine of site.Turbines) {
                        const _turbine = _site.Turbines.filter(val => val.id === turbine.id);
                        if (_turbine) {
                            _turbine.CurrentProduction += turbine.CurrentProduction;
                            _turbine.Windspeed += turbine.Windspeed;
                            _turbine.count++;
                        } else {
                            _site.Turbines.push({...turbine, count: 1});
                        }
                    }
                }
            }
        }

        let sitesResponse = Object.values(sites).map(site => {
            site.Turbines = site.Turbines.map(turbine => ({
                id: turbine.Id,
                name: turbine.Name,
                manufacturer: turbine.Manufacturer,
                maxProduction: turbine.MaxProduction,
                AvgCurrentProduction: turbine.CurrentProduction / turbine.count,
                AvgWindSpeed: turbine.Windspeed / turbine.count
            }));
            return site;
        });

        return {
            recorded_since: recorded_timestamp,
            sites: sitesResponse
        }
    }


    // Service public methods:
    /**
     * This function initializes the process of retrieving data from API every second
     */
    init() {
        setInterval(() => this._retrieveData(), retrieveDataInterval);
        // push new record every 5 minutes
        setInterval(() => {
            this._aggregatedValue = this.calculateAggregatedValue();
            this._aggregateData.push({
                recorded_timestamp: Date.now(),
                data: []
            })
        }, aggregationTimeInterval);
    }

    getAggregateValues() {
        return this._aggregatedValue ?? this.calculateAggregatedValue();
    }

    async getAllSites() {
        const res = await this._axiosClient.get('Site');
        return res.data;
    }

    async getSiteById(id) {
        const res = await this._axiosClient.get(`Site/${id}`);
        return res.data;
    }
}
