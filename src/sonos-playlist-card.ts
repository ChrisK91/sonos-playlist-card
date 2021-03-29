/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  customElement,
  property,
  CSSResult,
  TemplateResult,
  css,
  //PropertyValues,
  //internalProperty,
} from 'lit-element';
import {
  HomeAssistant,
  //hasConfigOrEntityChanged,
  //hasAction,
  //ActionHandlerEvent,
  //handleAction,
  //LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types
//import './editor';

import { subscribeEntities, HassEntities } from 'home-assistant-js-websocket';

import type { SonosPlaylistCardConfig, Playlist, PlaylistMessage } from './types';
//import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  Sonos Playlist Card \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'sonos-playlist-card',
  name: 'Sonos Playlist Card',
  description: 'A custom card to display spotify playlists and play them on Sonos speakers',
});

// TODO Name your custom element
@customElement('sonos-playlist-card')
export class SonosPlaylistCard extends LitElement {
  /*public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('boilerplate-card-editor');
  }*/

  private playlists: Array<Playlist> = [];

  public static getStubConfig(): object {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit-element.polymer-project.org/guide/properties
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Object }) public config!: SonosPlaylistCardConfig;
  @property({ type: Boolean }) playlistsLoaded = false;
  private fetchTimeOut: any = 0;
  private unsubscribeEntitites?: any;


  // https://lit-element.polymer-project.org/guide/properties#accessors-custom
  public setConfig(config: SonosPlaylistCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'Sonos Spotify Playlist',
      ...config,
    };
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.updateSpotcast();
    //this.doSubscribeEntities(); TODO: uncomment
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.unsubscribeEntitites) {
      this.unsubscribeEntitites();
      this.unsubscribeEntitites = undefined;
    }

  }

  private updateSpotcast(): void {
    // Debounce updates to 500ms
    if (this.fetchTimeOut) {
      clearTimeout(this.fetchTimeOut);
    }
    this.fetchTimeOut = setTimeout(async () => {
      if (this.hass) {
        //request update of spotcast data
        await this._updatePlaylists();
      }
    }, 500);
  }


  public doSubscribeEntities(): void {
    if (this.hass?.connection && !this.unsubscribeEntitites && this.isConnected) {
      this.unsubscribeEntitites = subscribeEntities(this.hass.connection, (entities) =>
        this.entitiesUpdated(entities)
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private entitiesUpdated(entities: HassEntities): void {
    // console.log("Entities updated!");
     console.log(entities);
    // TODO: handle update of entities
  }

  // https://lit-element.polymer-project.org/guide/templates
  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning'));
    }

    if (this.config.show_error) {
      return this._showError(localize('common.show_error'));
    }

    //         grid-template-columns: repeat(auto-fit, minmax(30%, 1fr));

    const columnWidth = this.config.gridWidth ?? 30;

    return html`
      <ha-card tabindex="0" style="padding: 0.2em">
        ${this.playlistsLoaded ? html`
        <div class="playlistcontainer" .style="grid-template-columns: repeat(auto-fit, minmax(${columnWidth}%, 1fr))">
          ${this.playlists.map(i => html`
          <div class="griditem" @click="${(): void => this._playPlaylist(i.uri)}"><img .src="${i.images[0].url}"></div>
          `)}
        </div>
        `: html`<p>Playlists not loaded</p>`}
      </ha-card>
    `;
  }

  private _playPlaylist(identifier: string): void {
    this.hass.callService("media_player", "play_media", {
      // eslint-disable-next-line @typescript-eslint/camelcase
      entity_id: this.config.player,
      // eslint-disable-next-line @typescript-eslint/camelcase
      media_content_id: identifier,
      // eslint-disable-next-line @typescript-eslint/camelcase
      media_content_type: "music"
    });
  }

  private _showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html`
      ${errorCard}
    `;
  }

  private async _updatePlaylists(): Promise<void> {
    const message: PlaylistMessage = {
      type: 'spotcast/playlists',
      // eslint-disable-next-line @typescript-eslint/camelcase
      playlist_type: this.config.playlist_type || '',
      account: this.config.account || "default",
      limit: this.config.limit || 10, //this.config.limit,
    };
    if (this.config.country_code) {
      // eslint-disable-next-line @typescript-eslint/camelcase
      message.country_code = this.config.country_code;
    }

    try {
      const res: any = await this.hass.callWS(message) as Array<Playlist>;
      this.playlists = res.items;
    } catch (e) {
      throw Error('Failed to fetch playlists: ' + e);
    } finally {
      this.playlistsLoaded = true;
    }
  }

  // https://lit-element.polymer-project.org/guide/styles
  static get styles(): CSSResult {
    return css`

      div.playlistcontainer {
        display: grid;
        grid-gap: 0.2em;
        margin: 0.5em;
      }

      div.griditem {
        position: flex;
        cursor: pointer;
      }

      div.griditem > img {
        width: 100%;
      }
    `;
  }
}
