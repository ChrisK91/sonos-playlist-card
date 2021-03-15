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
  internalProperty,
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
  @internalProperty() private config!: SonosPlaylistCardConfig;
  @property({type: Boolean}) playlistsLoaded = false;

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

  // https://lit-element.polymer-project.org/guide/templates
  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning'));
    }

    if (this.config.show_error) {
      return this._showError(localize('common.show_error'));
    }

    console.log("Rendering");

    return html`
      <ha-card
        .header=${this.config.name}
        tabindex="0"
      >
      ${this.playlistsLoaded?
        html`
          <p>Playlists: ${this.playlists.length}</p>
          <ul>
            ${this.playlists.map(i => html`<li>${i.name}</li>`)}
          </ul>
        `:
        html`<p>Playlists not loaded</p>`}

      <button @click="${this._updatePlaylists}">Update Playlist</button>
      </ha-card>
    `;
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

  private async _updatePlaylists(): Promise<void>{
    const message: PlaylistMessage = {
      type: 'spotcast/playlists',
      // eslint-disable-next-line @typescript-eslint/camelcase
      playlist_type: this.config.playlist_type || '',
      account: "default", // this.config.account,
      limit: 10, //this.config.limit,
    };
    if (this.config.country_code) {
      // eslint-disable-next-line @typescript-eslint/camelcase
      message.country_code = this.config.country_code;
    }
    console.info(message);

    try {
      const res: any = await this.hass.callWS(message) as Array<Playlist>;
      console.log(res.items);
      this.playlists = res.items;
    } catch (e) {
      throw Error('Failed to fetch playlists: ' + e);
    } finally {
      this.playlistsLoaded = true;
      console.log("Loaded: " + this.playlistsLoaded);
    }
  }

  // https://lit-element.polymer-project.org/guide/styles
  static get styles(): CSSResult {
    return css``;
  }
}
