import {
  mixinDialogMutations,
  mixinDialogActions,
  mixinDialogGetters
} from '../../mixins/vuex_dialogs';
import {
  mixinSetLoading
} from '../../mixins/vuex_loading';

// import i18n from '../../i18n';

export default {
  namespaced: true,
  state: {
    campaigns: {
      all: [],
      selected: localStorage.getItem('adsmanager-campaigns-selected') ?
        JSON.parse(localStorage.getItem('adsmanager-campaigns-selected')) : [],
      filtered: [],
    },
    loading: {
      mainTable: false,
    },
    stat: []
  },
  getters: {
    ...mixinDialogGetters,

    campaigns: state => state.campaigns,
    selected: state => state.campaigns.selected,
    loading: state => state.loading,
    stat: state => state.stat,
  },
  mutations: {
    ...mixinDialogMutations,
    ...mixinSetLoading,

    SET_ALL: (state, campaigns) => {
      state.campaigns.all = campaigns;
    },

    FILTER: state => {
      state.campaigns.filtered = state.campaigns.all;
    },

    SET_STAT: (state, stat) => {
      state.stat = stat;
    },

    SET_SELECTED: (state, data) => {
      state.campaigns.selected = data;
      localStorage.setItem('adsmanager-campaigns-selected', JSON.stringify(data));
    }
  },
  actions: {
    ...mixinDialogActions,

    async loadCampaigns({commit, rootState, dispatch}) {
      const data = {
        users_ids: rootState.users.users.all.length === 0 ?
          -1 : rootState.users.users.selected.length > 0 ?
            rootState.users.users.selected.map(user => user.id) : 
            rootState.users.users.filtered.map(user => user.id),
        accounts_ids: rootState.accounts.accounts.all.length === 0 ?
          -1 : rootState.accounts.accounts.selected.length > 0 ?
            rootState.accounts.accounts.selected.map(account => account.id) : 
            rootState.accounts.accounts.filtered.map(account => account.id),
        cabs_ids: rootState.cabs.cabs.all.length === 0 ?
          -1 : rootState.cabs.cabs.selected.length > 0 ?
            rootState.cabs.cabs.selected.map(cab => cab.id) :
            rootState.cabs.cabs.filtered.map(cab => cab.id)
      };
      
      const response = await this._vm.api.post('/campaigns', data);
      if (response.data.success) {
        commit('SET_ALL', response.data.data);
        commit('FILTER');
        dispatch('loadStat');
      }
    },

    async loadStat({
      dispatch,
      commit,
      rootState
    }) {
      commit('SET_LOADING', {
        param: 'mainTable',
        value: true,
      });

      const data = {
        ids: rootState.campaigns.campaigns.filtered.map(campaign => campaign.id),
        dates: rootState.adsmanager.filters.dates,
      };
      const response = await this._vm.api.post('/stat/by_campaign', data).catch((e) => {
        dispatch('main/apiError', e, {
          root: true
        });
      });

      commit('SET_LOADING', {
        param: 'mainTable',
        value: false,
      });

      commit('SET_STAT', response.data.data);
    },

    async saveSelected(context, data) {
      context.commit('SET_SELECTED', data);
    },
  }
};