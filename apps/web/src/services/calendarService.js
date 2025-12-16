/**
 * Calendar Service - Wrapper
 * Exports the GraphQL calendar service for use throughout the app
 */

import { graphqlCalendarService } from './calendarService.graphql';

export const calendarService = graphqlCalendarService;

export default calendarService;
