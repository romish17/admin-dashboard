import { useEffect, useState } from 'react';
import { apiGet, apiPost, getErrorMessage } from '@/services/api';
import { RssFeed, RssItem, PaginatedResponse } from '@/types';
import { PlusIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export function RssFeedsList() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [items, setItems] = useState<RssItem[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchFeeds();
    fetchItems();
  }, [selectedFeed]);

  async function fetchFeeds() {
    try {
      const data = await apiGet<RssFeed[]>('/rss/feeds');
      setFeeds(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function fetchItems() {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedFeed) params.feedId = selectedFeed;
      const response = await apiGet<PaginatedResponse<RssItem>>('/rss/items', params);
      setItems(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshAllFeeds() {
    setIsRefreshing(true);
    try {
      const result = await apiPost<{ success: number; failed: number }>('/rss/feeds/refresh-all');
      toast.success(`Refreshed ${result.success} feeds`);
      fetchItems();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await apiPost(`/rss/items/${id}/read`);
      setItems(items.map(i => i.id === id ? { ...i, isRead: true } : i));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">RSS Feeds</h1>
          <p className="text-dark-400">Stay updated with your favorite sources</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshAllFeeds} className="btn-secondary" disabled={isRefreshing}>
            <ArrowPathIcon className={clsx('w-5 h-5 mr-2', isRefreshing && 'animate-spin')} />
            Refresh All
          </button>
          <button className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Feed
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Feeds sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="card">
            <h3 className="text-sm font-medium text-dark-300 mb-3">Feeds</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFeed('')}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  !selectedFeed ? 'bg-primary-600/20 text-primary-400' : 'text-dark-300 hover:bg-dark-700'
                )}
              >
                All Feeds
              </button>
              {feeds.map((feed) => (
                <button
                  key={feed.id}
                  onClick={() => setSelectedFeed(feed.id)}
                  className={clsx(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                    selectedFeed === feed.id ? 'bg-primary-600/20 text-primary-400' : 'text-dark-300 hover:bg-dark-700'
                  )}
                >
                  <span className="truncate">{feed.title}</span>
                  {feed.unreadCount ? (
                    <span className="badge bg-primary-500/20 text-primary-400">{feed.unreadCount}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-dark-400">No items found. Add some RSS feeds!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markAsRead(item.id)}
                  className={clsx(
                    'card-hover block',
                    item.isRead && 'opacity-60'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className={clsx(
                        'font-medium',
                        item.isRead ? 'text-dark-400' : 'text-dark-100'
                      )}>
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-dark-400 text-sm mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-dark-500">
                        <span>{item.feed.title}</span>
                        {item.publishedAt && (
                          <span>{formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}</span>
                        )}
                      </div>
                    </div>
                    {!item.isRead && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
