
import {Component, HostListener,OnInit, Inject, Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {CompanyDetailsService} from '../core/services/companydetails.service';
import {TL_EVENT_LIST} from '../core/constant/request-body.constant';
import {LocalStorageService} from '../core/services/localStorage.service';
import {Title} from '@angular/platform-browser';
import { DOCUMENT,Location } from '@angular/common';
import {APPLICATION_TITLE, ROUTING_CONSTANT} from '../core/constant/application-title.constant';
import {LOCAL_STORAGE_CONSTANT_KEY, SOURCE_SYSTEM_CONSTANT, TIMELINE_CONSTANT} from '../core/constant/app.constants';
import {UtilsService} from '../core/services/utils.service';
import { environment } from '../../environments/environment';

declare var FusionCharts: any;
/*declare var data: any;
declare var schema: any;*/

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss'],
})
export class TimelineComponent implements OnInit {

    companyId: number;
    paramsSubscription: Subscription;
    spinnerFlag = false;
    params: object = {};
    userData;
    companyName: string;
    cin: string;
    city: string;
    state: string;
    companyStatus: string;
    schema = [];
    data = [];
    calledFrom;
    chart;
    chartInitialZoomDate = {
        startDate: '',
        endDate: ''
    };
    processStatus;
    /*localStorageFilters = {
        'category': [],
        'events': [],
        'flags': [],
        'trendlines': [],
    };*/
    reloadButtonListener = ((eventObj, eventArgs) => {
        this.checkUserAuthentication();
        this.loadEventsData();
    });
    apiStatus = 1;
    homeLinkbaseUrl='/';
    constructor(@Inject(DOCUMENT) private document: any,private route: ActivatedRoute, private router: Router, private companyDetailsService: CompanyDetailsService, private localStorageService: LocalStorageService, private titleService: Title, private utilService: UtilsService, private location: Location ) {
    	
    	this.paramsSubscription = this.route.params.subscribe(params => {
            this.companyId = +params['id'];
            this.calledFrom = params['from'];
            this.processStatus = params['process'];
        });
    	
    	if(this.calledFrom == ROUTING_CONSTANT.TIMELINE_FROM_CORPOSITORY) {
    		this.homeLinkbaseUrl = environment.insightUrl;
    		this.route.queryParams.subscribe(params => {
	             if (params.param1 && params.param2) {
	            	 let userData = {
			        userId: params.param1,
			        token: params.param2,
			        email: '-',
			        firstName: '-',
			        isTimeline: true
			    };
		    	this.localStorageService.setItem('userData', userData);
	            }
	          });    	
    	}
    	this.userData = JSON.parse(this.localStorageService.getItem('userData'));
        if(!this.userData) {
            this.router.navigate(['/login'])
        }
        /*let category = this.localStorageService.getItem(LOCAL_STORAGE_CONSTANT_KEY.TIMELINE_FILTER_CATEGORY);
        let events = this.localStorageService.getItem(LOCAL_STORAGE_CONSTANT_KEY.TIMELINE_FILTER_EVENTS);
        let flags = this.localStorageService.getItem(LOCAL_STORAGE_CONSTANT_KEY.TIMELINE_FILTER_FLAG);
        let trendlines = this.localStorageService.getItem(LOCAL_STORAGE_CONSTANT_KEY.TIMELINE_FILTER_TRENDLINE);

        if(category) {
            this.localStorageFilters.category = JSON.parse(category);
        }
        if(events) {
            this.localStorageFilters.events = JSON.parse(events);
        }
        if(flags) {
            this.localStorageFilters.flags = JSON.parse(flags);
        }
        if(trendlines) {
            this.localStorageFilters.trendlines = JSON.parse(trendlines);
        }*/
        

    }

    ngOnInit() {
        this.titleService.setTitle(APPLICATION_TITLE.TIMELINE);
//        this.paramsSubscription = this.route.params.subscribe(params => {
//            this.companyId = +params['id'];
//            this.calledFrom = params['from'];
//            this.processStatus = params['process'];
//        });

        if(this.companyId && !isNaN(this.companyId)) {
            TL_EVENT_LIST['para']['user_id'] = this.userData.userId;
            TL_EVENT_LIST['para']['api_auth_token'] = this.userData.token;
            TL_EVENT_LIST['para']['company_ids'] = [this.companyId];
            TL_EVENT_LIST['para']['is_company_count'] = 1;
            TL_EVENT_LIST['para']['source_system'] = SOURCE_SYSTEM_CONSTANT.TIMELINE;
            TL_EVENT_LIST['para']['fetch_data'] = 1;
            TL_EVENT_LIST['para']['monitoring_period_start_date'] = this.utilService.getDefaultFormattedStartDate();
            TL_EVENT_LIST['para']['monitoring_period_end_date'] = this.utilService.getTodaysFormattedDate();

            if(this.calledFrom) {
                if(this.calledFrom == ROUTING_CONSTANT.TIMELINE_FROM_EVENTS) {
                    let dates = JSON.parse(this.localStorageService.getItem(LOCAL_STORAGE_CONSTANT_KEY.DATE));
                    if(dates) {
                        this.chartInitialZoomDate.startDate = this.utilService.formatDateForChart(dates.startDate);
                        this.chartInitialZoomDate.endDate = this.utilService.formatDateForChart(dates.endDate);
                    }
                } else if(this.calledFrom == ROUTING_CONSTANT.TIMELINE_FROM_FULL_REPORT) {
                    let dates = JSON.parse(this.localStorageService.getItem(LOCAL_STORAGE_CONSTANT_KEY.DATE));
                    if(dates) {
                        this.chartInitialZoomDate.startDate = this.utilService.formatDateForChart(dates.startDate);
                        this.chartInitialZoomDate.endDate = this.utilService.formatDateForChart(dates.endDate);
                    }
                } else if(this.calledFrom == ROUTING_CONSTANT.TIMELINE_FROM_ALL_COMPANIES) {
                    this.chartInitialZoomDate.startDate = this.utilService.formatDateForChart('1900-01-01');
                    this.chartInitialZoomDate.endDate = this.utilService.getTodaysFormattedDateForChart();
                }else if(this.calledFrom == ROUTING_CONSTANT.TIMELINE_FROM_CORPOSITORY) {
                    this.chartInitialZoomDate.startDate = this.utilService.formatDateForChart('1900-01-01');
                    this.chartInitialZoomDate.endDate = this.utilService.getTodaysFormattedDateForChart();
                }
            } else {
                this.router.navigate(['/login']);
            }

            if(!this.chartInitialZoomDate || !this.chartInitialZoomDate.startDate || !this.chartInitialZoomDate.endDate || this.chartInitialZoomDate.startDate.length < 1 || this.chartInitialZoomDate.endDate.length < 1) {
                this.chartInitialZoomDate.startDate = this.utilService.formatDateForChart('1900-01-01');
                this.chartInitialZoomDate.endDate = this.utilService.getTodaysFormattedDateForChart();
            }

            if(this.chartInitialZoomDate.startDate == this.chartInitialZoomDate.endDate) {
                //same date, make range of 1 week
                this.chartInitialZoomDate.startDate = this.utilService.getDateBeforeNWeek(this.chartInitialZoomDate.endDate, 1);
            }

            this.params = { ...TL_EVENT_LIST };
            this.loadEventsData();
        } else {
            this.apiStatus = 0;
        }
    }

    ngAfterViewInit() {

    }

    ngOnDestroy() {
        this.titleService.setTitle(APPLICATION_TITLE.DEFAULT);
    }

    loadEventsData() {
        this.apiStatus = 1;
        this.spinnerFlag = true;
        this.companyDetailsService.loadTimelineData(this.params).subscribe((response: any) => {
            this.spinnerFlag = false;
            if(response && response.hasOwnProperty('status')) {
                this.apiStatus = response['status'];
                if(response['status'] == 1 && response.hasOwnProperty('data')) {
                    this.schema = response['data']['schema'];
                    if(response['data'].hasOwnProperty('companies_event_data') && response['data']['companies_event_data'].length > 0) {
                        let companyEvents = response['data']['companies_event_data'][0];
                        this.data = companyEvents['events'];
                        this.companyName = companyEvents['company_name'];
                        this.cin = companyEvents['cin'];
                        this.city = companyEvents['city'];
                        this.state = companyEvents['state'];
                        this.companyStatus = companyEvents['company_status'];

                        if(this.data && this.data.length > 0 && this.schema) {
                            this.initialiseTimeline();
                        }
                    } else {
                    	if (this.calledFrom == ROUTING_CONSTANT.TIMELINE_FROM_CORPOSITORY && this.processStatus == "1") {
                            this.apiStatus = 4;							
						}else {
							this.apiStatus = 2;
						}
                    }
                }else {
                	if (this.calledFrom == ROUTING_CONSTANT.TIMELINE_FROM_CORPOSITORY && this.processStatus == "1") {
                        this.apiStatus = 4;							
					}
				}
            } else {
                this.apiStatus = 0;
            }
            /*if(response && response.hasOwnProperty('status') && response['status'] == 1 && response.hasOwnProperty('data')) {
                this.schema = response['data']['schema'];
                if(response['data'].hasOwnProperty('companies_event_data') && response['data']['companies_event_data'].length > 0) {
                    let companyEvents = response['data']['companies_event_data'][0];
                    this.data = companyEvents['events'];
                    this.companyName = companyEvents['company_name'];
                    this.cin = companyEvents['cin'];
                    this.city = companyEvents['city'];
                    this.state = companyEvents['state'];
                    this.companyStatus = companyEvents['company_status'];

                    if(this.data && this.data.length > 0 && this.schema) {
                        this.initialiseTimeline();
                    }
                }
            }*/
        });
    }

    initialiseTimeline() {
        const dataStore = new FusionCharts.DataStore(this.data, this.schema);
        this.chart = new FusionCharts({
            type: 'corpository',
            renderAt: 'container-timeline',
            width: '100%',
            height: '630',
            dataSource: {
                data: dataStore.getDataTable(),
                filter: {
                    filterNameMap: {
                        category: TIMELINE_CONSTANT.CATEGORY_LABEL,
                        description: TIMELINE_CONSTANT.EVENTS_LABEL,
                        flag: TIMELINE_CONSTANT.FLAG_LABEL,
                        measure: TIMELINE_CONSTANT.TRENDLINE_LABEL
                    },
                    style: {
                        header: {
                            'font-family' : 'Open Sans',
                            'font-weight' : '600'
                        },
                        item: {
                            'font-family' : 'Open Sans'
                        }
                    }
                },
                chart: {
                    companyDetails: {
                        name: this.companyName,
                        cin: this.cin,
                        status: this.companyStatus,
                        statusflag: '#00a9a6',
                        city: this.city,
                        state: this.state
                    },
                    noMeasuresToDisplayMessage: 'No ' + TIMELINE_CONSTANT.TRENDLINE_LABEL + ' to Display',
                    initialFilterSelection: {
                        measures: ["Change in Total Open Charges"],
                        flags: [],
                        eventCategories: [],
                        eventDescription: []
                    },
                    measureFormat: {
                        'Net worth': function (value) {
                            return this.processTrendlines(value);
                        }.bind(this),
                        'Change in Total Open Charges': function (value) {
                            return this.processTrendlines(value);
                        }.bind(this),
                        'Revenue from Operations': function (value) {
                            return this.processTrendlines(value);
                        }.bind(this),
                        'EBITDA': function (value) {
                            return this.processTrendlines(value);
                        }.bind(this),
                        'Total Fixed Assets': function (value) {
                            return this.processTrendlines(value);
                        }.bind(this),
                        'Inventory Days': function (value) {
                            return this.processTrendlines(value);
                        }.bind(this),
                        'Receivable Days': function (value) {
                            return this.processTrendlines(value);
                        }.bind(this),
                        'Interest Coverage': function (value) {
                            return this.processTrendlines(value);
                        }.bind(this),
                        'Current Ratio': function (value) {
                            return this.processTrendlines(value);
                        }.bind(this),
                        'EBITDA Margins': function (value) {
                            return this.processTrendlines(value);
                        }.bind(this),
                        'Total debt/equity ratio': function (value) {
                            return this.processTrendlines(value);
                        }.bind(this)
                    },
                    initialZoom: {
                        from : this.chartInitialZoomDate.startDate,
                        to: this.chartInitialZoomDate.endDate
                    },
                    showToolTip: 1,
                    style: {
                        background: {
                            "fill": "#f5f5f5",
                            "stroke": "#f5f5f5"
                        },
                        text: {
                            'font-family': 'Titillium Web',
                        },
                        reloadButton: {
                            button: {
                                fill: '#065393'
                            },
                            text: {
                                fill: '#ffffff',
                                'font-family': 'Open Sans'
                            }
                        },
                        resetButton: {
                            button: {
                                fill: '#065393'
                            },
                            text: {
                                fill: '#ffffff',
                                'font-family': 'Open Sans'
                            }
                        }
                    },
                    showTrendlabels: true
                },
                trendline: {
                    palette: ['#065393', '#00A9A6', '#F7BE11','#4169E1','#FFD700','#00FF00'],
                    style: {
                    }
                },
                eventMarker: {
                    marker: {
                        flagColorMap: {
                            Red: '#fe5900',
                            Green: '#00A9A6',
                            Yellow: '#F7BE11'
                        },
                    }
                },
                eventBucket: {
                    text: {
                        hAlign: 'left',
                        vAlign: 'bottom',
                        style: {
                            'font-weight' : 'bold',
                            'fill' : '#000'
                        }
                    },
                    lane: {
                        palette: []
                    }
                }
            },
            loadMessage: 'I-./../assets/images/loading.gif'
        });
        //this.chart.addEventListener(["renderComplete","ApplyButtonClick","focusLimitChanged"], eventListener);
        this.chart.addEventListener(["ReloadButtonClick"], this.reloadButtonListener);
        this.chart.render();
    }

    ngAfterContentChecked() {
    }

    processTrendlines(value) {
        if(value) {
            var val = parseFloat(value);
            let unit;
            if (val >= 10000000 || val <= -10000000) {
                val = parseFloat((val / 10000000).toFixed(2));
                unit = ' Cr';
            } else if (val >= 100000 || val <= -100000) {
                val = parseFloat((val / 100000).toFixed(2));
                unit = ' Lac';
            } else if(val >= 1000 || val <= -1000) {
                val = parseFloat((val/1000).toFixed(2));
                unit = ' K';
            }
            if(unit) {
                return val + unit;
            }
            return (val).toFixed(2);
        }
        return value;
    }

    @HostListener('document:click', ['$event'])
    @HostListener('window:focus', ['$event'])
    listenEvents(event) {
        this.checkUserAuthentication();
    }

    checkUserAuthentication(){
        this.userData = JSON.parse(this.localStorageService.getItem('userData'));
        if(!this.userData) {
            this.router.navigate(['/login'])
        }
    }
    goHomePage(){
    	let url: string = '';
	    if (!/^http[s]?:\/\//.test(this.homeLinkbaseUrl)) {
	        url += 'http://';
	    }
	    url += this.homeLinkbaseUrl;
	    window.open(url, '_parent');
    }
}
